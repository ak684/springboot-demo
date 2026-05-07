package io.ventureplatform.service;

import io.ventureplatform.configuration.BrandingProperties;
import io.ventureplatform.dto.response.BrandingResponse;
import lombok.Getter;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.source.ConfigurationPropertySources;
import org.springframework.core.env.MutablePropertySources;
import org.springframework.core.env.PropertiesPropertySource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Properties;

@Service
public class BrandingService {
  public static final String DEFAULT_BRAND = "default";
  public static final String WISTA_BRAND = "wista";

  @Getter
  private final BrandingProperties defaultBrandingProperties;
  @Getter
  private final BrandingProperties wistaBrandingProperties;
  @Getter
  private final BrandingResponse defaultBrandingResponse;
  @Getter
  private final BrandingResponse wistaBrandingResponse;

  public BrandingService(
    final BrandingProperties brandingProperties,
    final ResourceLoader resourceLoader
  ) {
    BrandingProperties defaultProperties = new BrandingProperties();
    BeanUtils.copyProperties(brandingProperties, defaultProperties);
    this.defaultBrandingProperties = defaultProperties;
    this.defaultBrandingResponse = BrandingResponse.fromProperties(defaultProperties);
    this.wistaBrandingProperties = loadWistaBrandingProperties(
      resourceLoader,
      defaultProperties
    );
    this.wistaBrandingResponse = BrandingResponse.fromProperties(wistaBrandingProperties);
  }

  public BrandingResponse resolveBrandingResponse(final String brand, final String host) {
    String key = resolveBrandKey(brand, host);
    return WISTA_BRAND.equals(key) ? wistaBrandingResponse : defaultBrandingResponse;
  }

  public BrandingProperties getBrandingPropertiesForKey(final String brandKey) {
    if (WISTA_BRAND.equalsIgnoreCase(brandKey)) {
      return wistaBrandingProperties;
    }
    return defaultBrandingProperties;
  }

  public String resolveBrandKey(final String brand, final String host) {
    if (brand != null) {
      if (brand.isBlank() || DEFAULT_BRAND.equalsIgnoreCase(brand)) {
        return DEFAULT_BRAND;
      }
      if (WISTA_BRAND.equalsIgnoreCase(brand)) {
        return WISTA_BRAND;
      }
      return DEFAULT_BRAND;
    }
    return resolveBrandKeyFromHost(host);
  }

  public String resolveBrandKeyFromHost(final String host) {
    if (host != null && !host.isBlank() && host.toLowerCase(Locale.ROOT).contains(WISTA_BRAND)) {
      return WISTA_BRAND;
    }
    return DEFAULT_BRAND;
  }

  private BrandingProperties loadWistaBrandingProperties(
    final ResourceLoader resourceLoader,
    final BrandingProperties defaultProperties
  ) {
    Resource resource = resourceLoader.getResource("classpath:application-wista.yml");
    if (!resource.exists()) {
      throw new IllegalStateException("Missing WISTA branding configuration: application-wista.yml");
    }

    YamlPropertiesFactoryBean factoryBean = new YamlPropertiesFactoryBean();
    factoryBean.setResources(resource);
    Properties properties = factoryBean.getObject();
    if (properties == null) {
      throw new IllegalStateException("Unable to load WISTA branding configuration");
    }

    MutablePropertySources propertySources = new MutablePropertySources();
    propertySources.addFirst(new PropertiesPropertySource("wistaBranding", properties));

    BrandingProperties wistaProperties = new BrandingProperties();
    BeanUtils.copyProperties(defaultProperties, wistaProperties);
    Binder binder = new Binder(ConfigurationPropertySources.from(propertySources));
    binder.bind("application.branding", Bindable.ofInstance(wistaProperties));
    return wistaProperties;
  }
}
