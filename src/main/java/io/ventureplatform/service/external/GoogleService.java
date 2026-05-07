package io.ventureplatform.service.external;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.model.EmbeddedChart;
import com.google.api.services.sheets.v4.model.Sheet;
import com.google.api.services.sheets.v4.model.Spreadsheet;
import com.google.api.services.sheets.v4.model.ValueRange;
import com.google.api.services.slides.v1.Slides;
import com.google.api.services.slides.v1.model.AffineTransform;
import com.google.api.services.slides.v1.model.BatchUpdatePresentationRequest;
import com.google.api.services.slides.v1.model.CreateSheetsChartRequest;
import com.google.api.services.slides.v1.model.DeleteObjectRequest;
import com.google.api.services.slides.v1.model.Dimension;
import com.google.api.services.slides.v1.model.DuplicateObjectRequest;
import com.google.api.services.slides.v1.model.InsertTextRequest;
import com.google.api.services.slides.v1.model.OpaqueColor;
import com.google.api.services.slides.v1.model.Page;
import com.google.api.services.slides.v1.model.PageElement;
import com.google.api.services.slides.v1.model.PageElementProperties;
import com.google.api.services.slides.v1.model.Presentation;
import com.google.api.services.slides.v1.model.Range;
import com.google.api.services.slides.v1.model.Request;
import com.google.api.services.slides.v1.model.RgbColor;
import com.google.api.services.slides.v1.model.Size;
import com.google.api.services.slides.v1.model.SolidFill;
import com.google.api.services.slides.v1.model.TableBorderFill;
import com.google.api.services.slides.v1.model.TableBorderProperties;
import com.google.api.services.slides.v1.model.TableCellLocation;
import com.google.api.services.slides.v1.model.TableRange;
import com.google.api.services.slides.v1.model.TextStyle;
import com.google.api.services.slides.v1.model.UpdateTableBorderPropertiesRequest;
import com.google.api.services.slides.v1.model.UpdateTextStyleRequest;
import com.google.maps.GeoApiContext;
import com.google.maps.GeocodingApi;
import com.google.maps.model.GeocodingResult;
import io.ventureplatform.configuration.BrandingProperties;
import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactScore;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.exception.custom.InvalidTokenException;
import io.ventureplatform.service.CalculationService;
import io.ventureplatform.service.UserService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.Accessors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.validation.ValidationException;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class GoogleService {
  @Value("${google.api.clientId}")
  private String clientId;
  @Value("${google.api.clientSecret}")
  private String clientSecret;
  @Value("${google.api.mapsKey}")
  private String mapsApiKey;

  private final CalculationService calculationService;
  private final UserService userService;
  private final BrandingProperties brandingProperties;

  private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
  private static final String TEMPLATE_SPREADSHEET_ID = "1kEcZCXvma3xyVLSBPwnf1uDKxWuTpEw66VhtKX66_wQ";
  private static final String TEMPLATE_PRESENTATION_ID = "1TjBr_6qJYsf2m5K5ByM12gMP-G7uy8JnWCcC87JbG9k";
  private static final List<String> SCOPES = List.of(
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/presentations"
  );

  private Credential getCredentials(User user) {
    GoogleCredential credential = new GoogleCredential.Builder()
      .setTransport(new NetHttpTransport())
      .setJsonFactory(new GsonFactory())
      .setClientSecrets(clientId, clientSecret)
      .build();

    credential.setAccessToken(user.getGoogleToken());
    credential.setRefreshToken(user.getGoogleRefreshToken());
    return credential.createScoped(SCOPES);
  }

  private Sheets getSheetsService(Credential credential) throws GeneralSecurityException, IOException {
    HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
    return new Sheets.Builder(httpTransport, JSON_FACTORY, credential)
      .setApplicationName(getApplicationName())
      .build();
  }

  private Drive getDriveService(Credential credential) throws GeneralSecurityException, IOException {
    final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
    return new Drive.Builder(httpTransport, JSON_FACTORY, credential)
      .setApplicationName(getApplicationName())
      .build();
  }

  private Slides getSlidesService(Credential credential) throws GeneralSecurityException, IOException {
    final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
    return new Slides.Builder(httpTransport, JSON_FACTORY, credential)
      .setApplicationName(getApplicationName())
      .build();
  }

  private String getApplicationName() {
    return brandingProperties.getCompanyName();
  }

  public List<String> prepareSpreadsheetAndSlide(Venture venture, User user) {
    Credential credential = getCredentials(user);

    try {
      Drive driveService = getDriveService(credential);
      Sheets sheetsService = getSheetsService(credential);
      Slides slidesService = getSlidesService(credential);
      String spreadsheetId = cloneDriveFile(driveService, TEMPLATE_SPREADSHEET_ID, venture.getName() + " Impact Pitch");
      String presentationId = cloneDriveFile(driveService, TEMPLATE_PRESENTATION_ID, venture.getName() + " Impact Pitch");
      List<Impact> impacts = getImpactsForSlide(venture);

      if (impacts.isEmpty()) {
        throw new ValidationException("There are no scored positive impacts");
      }

      updateSpreadsheetTable(sheetsService, spreadsheetId, impacts);
      copyChartToPresentation(slidesService, sheetsService, spreadsheetId, presentationId);
      copyTableToPresentation(slidesService, presentationId, impacts);
      deleteExcessiveFigures(slidesService, presentationId, impacts);

      // toDO: Move to a different step
      prepareTocSlide(slidesService, presentationId, venture);

      return List.of(
        String.format("https://docs.google.com/spreadsheets/d/%s/edit", spreadsheetId),
        String.format("https://docs.google.com/presentation/d/%s/edit", presentationId)
      );
    } catch (GoogleJsonResponseException ex) {
      if (ex.getStatusCode() == 401) {
        user.setGoogleToken(null).setGoogleRefreshToken(null);
        userService.update(user.getId(), user);
        throw new InvalidTokenException(ex.getMessage());
      }
      throw new RuntimeException(ex.getMessage(), ex);
    } catch (Exception ex) {
      throw new RuntimeException(ex.getMessage(), ex);
    }
  }

  private String cloneDriveFile(Drive driveService, String originalFileId, String newFileTitle) throws IOException {
    File fileMetadata = new File().setName(newFileTitle);
    File copiedFile = driveService.files().copy(originalFileId, fileMetadata).execute();
    return copiedFile.getId();
  }

  private List<Impact> getImpactsForSlide(Venture venture) {
    return venture.getImpacts().stream()
      .filter(Predicate.not(Impact::getDraft))
      .filter(Impact::getPositive)
      .filter(i -> getImpactScore(i) != null)
      .sorted((i1, i2) -> (int) ((getImpactScore(i2) - getImpactScore(i1)) * 10))
      .limit(5)
      .collect(Collectors.toList());
  }

  private Double getImpactScore(Impact impact) {
    if (impact.getScoring().isEmpty()) {
      return 0.0;
    }

    ImpactScore score = impact.getScoring().get(impact.getScoring().size() - 1);
    Double scoreValue = calculationService.getScore(score, impact);
    return Optional.ofNullable(scoreValue).orElse(0.0);
  }

  private void updateSpreadsheetTable(Sheets sheetsService, String spreadsheetId, List<Impact> impacts) throws IOException {
    List<List<Object>> newData = new ArrayList<>();

    for (int i = 0; i < impacts.size(); i++) {
      Impact impact = impacts.get(i);
      ImpactScore score = impact.getScoring().get(impact.getScoring().size() - 1);
      newData.add(Arrays.asList(
        impact.getName(),
        score.getProblemImportance().getScore(),
        score.getDegreeOfChange() * 1.0 / 100,
        i + 1,
        score.getSizeOfStakeholders().getScore()
      ));
    }

    ValueRange valueRange = new ValueRange().setValues(newData);
    sheetsService.spreadsheets().values()
      .update(spreadsheetId, "Slide1!A2:E" + (impacts.size() + 1), valueRange)
      .setValueInputOption("RAW")
      .execute();
  }

  private void copyChartToPresentation(
    Slides slidesService, Sheets sheetsService, String spreadsheetId, String presentationId
  ) throws IOException {
    Presentation presentation = slidesService.presentations().get(presentationId).execute();

    // Add the linked chart to the slide
    CreateSheetsChartRequest createSheetsChartRequest = new CreateSheetsChartRequest()
      .setSpreadsheetId(spreadsheetId)
      .setChartId(getChartId(sheetsService, spreadsheetId))
      .setElementProperties(new PageElementProperties()
        .setPageObjectId(presentation.getSlides().get(0).getObjectId())
        .setSize(new Size()
          .setHeight(new Dimension().setMagnitude(340.56).setUnit("PT"))
          .setWidth(new Dimension().setMagnitude(267.84).setUnit("PT")))
        .setTransform(
          new AffineTransform().setTranslateX(85.0).setTranslateY(52.0).setUnit("PT").setScaleX(1.0).setScaleY(1.0)
        )
      )
      .setObjectId("CreatedChart")
      .setLinkingMode("LINKED");

    Request addChartRequest = new Request().setCreateSheetsChart(createSheetsChartRequest);
    BatchUpdatePresentationRequest batchRequest = new BatchUpdatePresentationRequest()
      .setRequests(List.of(addChartRequest));
    slidesService.presentations().batchUpdate(presentationId, batchRequest).execute();
  }

  private void copyTableToPresentation(Slides slidesService, String presentationId, List<Impact> impacts)
    throws IOException {
    Presentation presentation = slidesService.presentations().get(presentationId).execute();
    Page slide = presentation.getSlides().get(0);

    // Find the table element on the slide
    String tableId = slide.getPageElements().stream()
      .filter(pe -> pe.getTable() != null)
      .map(PageElement::getObjectId)
      .findFirst()
      .orElse(null);

    List<Request> requests = new ArrayList<>();

    for (int i = 0; i < impacts.size(); i++) {
      Impact impact = impacts.get(i);
      ImpactScore score = impact.getScoring().get(impact.getScoring().size() - 1);
      String stakeholders = score.getSizeOfStakeholders().getDescription().replace(" over next 5 years", "");

      TableCellLocation leftCell = new TableCellLocation().setRowIndex(i).setColumnIndex(0);
      InsertTextRequest insertLeftTextRequest = new InsertTextRequest()
        .setObjectId(tableId)
        .setText(String.format("%s: %s", stakeholders, impact.getStakeholders()))
        .setInsertionIndex(0)
        .setCellLocation(leftCell);
      UpdateTextStyleRequest updateLeftStyleRequest = new UpdateTextStyleRequest()
        .setObjectId(tableId)
        .setStyle(new TextStyle().setBold(true))
        .setFields("bold")
        .setTextRange(new Range().setStartIndex(0).setEndIndex(stakeholders.length()).setType("FIXED_RANGE"))
        .setCellLocation(leftCell);
      TableCellLocation rightCell = new TableCellLocation().setRowIndex(i).setColumnIndex(2);
      InsertTextRequest insertRightTextRequest = new InsertTextRequest()
        .setObjectId(tableId)
        .setText(String.format("%d%% %s", score.getDegreeOfChange(), impact.getChange()))
        .setInsertionIndex(0)
        .setCellLocation(rightCell);
      UpdateTextStyleRequest updateRightStyleRequest = new UpdateTextStyleRequest()
        .setObjectId(tableId)
        .setStyle(new TextStyle().setBold(true))
        .setFields("bold")
        .setTextRange(
          new Range()
            .setStartIndex(0)
            .setEndIndex(score.getDegreeOfChange().toString().length() + 1)
            .setType("FIXED_RANGE")
        )
        .setCellLocation(rightCell);

      requests.add(new Request().setInsertText(insertLeftTextRequest));
      requests.add(new Request().setUpdateTextStyle(updateLeftStyleRequest));
      requests.add(new Request().setInsertText(insertRightTextRequest));
      requests.add(new Request().setUpdateTextStyle(updateRightStyleRequest));
    }

    BatchUpdatePresentationRequest body = new BatchUpdatePresentationRequest().setRequests(requests);
    slidesService.presentations().batchUpdate(presentationId, body).execute();
  }

  private void deleteExcessiveFigures(Slides slidesService, String presentationId, List<Impact> impacts) throws IOException {
    Presentation presentation = slidesService.presentations().get(presentationId).execute();
    Page slide = presentation.getSlides().get(0);

    // Find the table element on the slide
    Stream<Request> deleteTriangleRequests = slide.getPageElements().stream()
      .filter(pe -> pe.getShape() != null && "TRIANGLE".equals(pe.getShape().getShapeType()))
      .skip(impacts.size())
      .map(pe -> new DeleteObjectRequest().setObjectId(pe.getObjectId()))
      .map(r -> new Request().setDeleteObject(r));

    Stream<Request> deleteEllipseRequests = slide.getPageElements().stream()
      .filter(pe -> pe.getShape() != null && "ELLIPSE".equals(pe.getShape().getShapeType()))
      .filter(pe -> pe.getTransform().getTranslateX() > 3000000)
      .sorted((pe1, pe2) -> (int) (pe1.getTransform().getTranslateY() - pe2.getTransform().getTranslateY()))
      .skip(impacts.size())
      .map(pe -> new DeleteObjectRequest().setObjectId(pe.getObjectId()))
      .map(r -> new Request().setDeleteObject(r));
    List<Request> requests =
      Stream.concat(deleteTriangleRequests, deleteEllipseRequests).collect(Collectors.toList());

    if (!requests.isEmpty()) {
      BatchUpdatePresentationRequest body = new BatchUpdatePresentationRequest().setRequests(requests);
      slidesService.presentations().batchUpdate(presentationId, body).execute();
    }
  }

  private Integer getChartId(Sheets sheetsService, String spreadsheetId) throws IOException {
    Spreadsheet spreadsheet = sheetsService.spreadsheets().get(spreadsheetId).setIncludeGridData(false).execute();

    List<Sheet> sheets = spreadsheet.getSheets();

    for (Sheet sheet : sheets) {
      List<EmbeddedChart> charts = sheet.getCharts();
      if (charts.size() > 0) {
        return charts.get(0).getChartId();
      }
    }

    return null;
  }

  // -----------------------

  private void prepareTocSlide(Slides slidesService, String presentationId, Venture venture) throws IOException {
    Presentation presentation = slidesService.presentations().get(presentationId).execute();
    Page slide = presentation.getSlides().get(1);

    List<Impact> impacts = getImpactsForTocSlide(venture);
    int numberOfSlides = (impacts.size() - 1) / 3 + 1;

    List<Request> cloneSlideRequests = new ArrayList<>();

    for (int i = 0; i < numberOfSlides - 1; i++) {
      cloneSlideRequests.add(
        new Request().setDuplicateObject(new DuplicateObjectRequest().setObjectId(slide.getObjectId())));
    }

    BatchUpdatePresentationRequest body = new BatchUpdatePresentationRequest().setRequests(cloneSlideRequests);
    slidesService.presentations().batchUpdate(presentationId, body).execute();
    presentation = slidesService.presentations().get(presentationId).execute();

    for (int i = 0; i < numberOfSlides; i++) {
      slide = presentation.getSlides().get(i + 1);

      // Find the table element on the slide
      String tableId = slide.getPageElements().stream()
        .filter(pe -> pe.getTable() != null)
        .map(PageElement::getObjectId)
        .findFirst()
        .orElse(null);

      List<Request> updateSlideRequests = new ArrayList<>();

      for (PageElement element : slide.getPageElements()) {
        if (element.getShape() != null && "TEXT_BOX".equals(element.getShape().getShapeType())) {
          InsertTextRequest updateTitleRequest = new InsertTextRequest()
            .setObjectId(element.getObjectId())
            .setText(String.format(
              "Our innovation theory of change %s",
              numberOfSlides == 1 ? "" : String.format("(%d/%d)", i + 1, numberOfSlides))
            );

          updateSlideRequests.add(new Request().setInsertText(updateTitleRequest));
          break;
        }
      }

      for (int j = 0; j < 3; j++) {
        int index = i * 3 + j;

        if (impacts.size() <= index) {
          UpdateTableBorderPropertiesRequest updateBorderRequest = new UpdateTableBorderPropertiesRequest()
            .setObjectId(tableId)
            .setTableRange(
              new TableRange()
                .setLocation(new TableCellLocation().setRowIndex(3 + j * 2).setColumnIndex(0))
                .setColumnSpan(1)
                .setRowSpan(1)
            )
            .setFields("tableBorderFill")
            .setTableBorderProperties(new TableBorderProperties().setTableBorderFill(
              new TableBorderFill().setSolidFill(new SolidFill().setColor(new OpaqueColor().setRgbColor(
                new RgbColor().setRed(1.0f).setBlue(1.0f).setGreen(1.0f))
              ))
            ));
          updateSlideRequests.add(new Request().setUpdateTableBorderProperties(updateBorderRequest));
          continue;
        }

        Impact impact = impacts.get(index);
        StringBuilder impactNameText = new StringBuilder();
        double score = getImpactScore(impact);

        if (score > 0) {
          impactNameText.append(String.format("Score: %.0f%n%n", score));
        }

        impactNameText.append(impact.getName());

        TableCellLocation nameCell = new TableCellLocation().setRowIndex(3 + j * 2).setColumnIndex(0);
        InsertTextRequest insertNameRequest = new InsertTextRequest()
          .setObjectId(tableId)
          .setText(impactNameText.toString())
          .setInsertionIndex(0)
          .setCellLocation(nameCell);
        updateSlideRequests.add(new Request().setInsertText(insertNameRequest));
        UpdateTextStyleRequest updateNameStyleRequest = new UpdateTextStyleRequest()
          .setObjectId(tableId)
          .setStyle(new TextStyle().setBold(true))
          .setFields("bold")
          .setCellLocation(nameCell);
        updateSlideRequests.add(new Request().setUpdateTextStyle(updateNameStyleRequest));
        InsertTextRequest insertStatusQuoRequest = new InsertTextRequest()
          .setObjectId(tableId)
          .setText(impact.getStatusQuo())
          .setInsertionIndex(0)
          .setCellLocation(new TableCellLocation().setRowIndex(3 + j * 2).setColumnIndex(1));
        updateSlideRequests.add(new Request().setInsertText(insertStatusQuoRequest));
        InsertTextRequest insertInnovationRequest = new InsertTextRequest()
          .setObjectId(tableId)
          .setText(impact.getInnovation())
          .setInsertionIndex(0)
          .setCellLocation(new TableCellLocation().setRowIndex(3 + j * 2).setColumnIndex(2));
        updateSlideRequests.add(new Request().setInsertText(insertInnovationRequest));
        InsertTextRequest insertStakeholdersRequest = new InsertTextRequest()
          .setObjectId(tableId)
          .setText(impact.getStakeholders())
          .setInsertionIndex(0)
          .setCellLocation(new TableCellLocation().setRowIndex(3 + j * 2).setColumnIndex(3));
        updateSlideRequests.add(new Request().setInsertText(insertStakeholdersRequest));
        InsertTextRequest insertChangeRequest = new InsertTextRequest()
          .setObjectId(tableId)
          .setText(impact.getChange())
          .setInsertionIndex(0)
          .setCellLocation(new TableCellLocation().setRowIndex(3 + j * 2).setColumnIndex(4));
        updateSlideRequests.add(new Request().setInsertText(insertChangeRequest));
        String indicatorsText = "";

        for (int k = 0; k < impact.getIndicators().size(); k++) {
          indicatorsText += String.format("%d: %s\n", k + 1, impact.getIndicators().get(k).getName());
        }

        InsertTextRequest insertIndicatorsRequest = new InsertTextRequest()
          .setObjectId(tableId)
          .setText(indicatorsText)
          .setInsertionIndex(0)
          .setCellLocation(new TableCellLocation().setRowIndex(3 + j * 2).setColumnIndex(5));
        updateSlideRequests.add(new Request().setInsertText(insertIndicatorsRequest));

        if (!impact.getPositive()) {
          UpdateTableBorderPropertiesRequest updateBorderRequest = new UpdateTableBorderPropertiesRequest()
            .setObjectId(tableId)
            .setTableRange(
              new TableRange()
                .setLocation(new TableCellLocation().setRowIndex(3 + j * 2).setColumnIndex(0))
                .setColumnSpan(1)
                .setRowSpan(1)
            )
            .setFields("tableBorderFill")
            .setBorderPosition("LEFT")
            .setTableBorderProperties(new TableBorderProperties().setTableBorderFill(
              new TableBorderFill().setSolidFill(new SolidFill().setColor(new OpaqueColor().setRgbColor(
                new RgbColor().setRed(0.91f).setBlue(0.278f).setGreen(0.278f))
              ))
            ));
          updateSlideRequests.add(new Request().setUpdateTableBorderProperties(updateBorderRequest));
        }
      }

      BatchUpdatePresentationRequest tableBody = new BatchUpdatePresentationRequest().setRequests(updateSlideRequests);
      slidesService.presentations().batchUpdate(presentationId, tableBody).execute();
    }
  }

  private List<Impact> getImpactsForTocSlide(Venture venture) {
    return venture.getImpacts().stream()
      .filter(Predicate.not(Impact::getDraft))
      .sorted((i1, i2) -> {
        if (!i1.getPositive().equals(i2.getPositive())) {
          return Boolean.compare(i2.getPositive(), i1.getPositive());
        }

        return (int) ((getImpactScore(i2) - getImpactScore(i1)) * 10);
      })
      .collect(Collectors.toList());
  }

  public LatLng geocodeAddress(String address) throws Exception {
    GeoApiContext context = new GeoApiContext.Builder()
      .apiKey(mapsApiKey)
      .build();

    GeocodingResult[] results = GeocodingApi.geocode(context, address).await();
    if (results.length > 0) {
      return new LatLng(results[0].geometry.location.lat, results[0].geometry.location.lng);
    } else {
      return null;
    }
  }

  @Data
  @AllArgsConstructor
  @Accessors(chain = true)
  public static class LatLng {
    public final double lat;
    public final double lng;
  }
}
