import React, { memo } from 'react';
import { Box, Container } from "@mui/material";
import CertificationVentureInfo from "./containers/CertificationVentureInfo";
import CertificationLevel1 from "./containers/CertificationLevel1";
import CertificationLevel2 from "./containers/CertificationLevel2";
import CertificationLevel3 from "./containers/CertificationLevel3";
import CertificationLevel4 from "./containers/CertificationLevel4";
import CertificationLevel5 from "./containers/CertificationLevel5";
import GetCertificateModal from "./components/GetCertificateModal";
import useModal from "shared-components/hooks/useModal";
import CustomErrorBoundary from "../../containers/CustomErrorBoundary";

const Certification = () => {
  const [certificateModalOpen, getCertificate, closeCertificateModal, level] = useModal();

  return (
    <CustomErrorBoundary>
      <Container maxWidth='md'>
        <Box display='flex' flexDirection='column' gap={3}>
          <CertificationVentureInfo />
          <CertificationLevel1 getCertificate={getCertificate} />
          <CertificationLevel2 getCertificate={getCertificate} />
          <CertificationLevel3 getCertificate={getCertificate} />
          <CertificationLevel4 getCertificate={getCertificate} />
          <CertificationLevel5 getCertificate={getCertificate} />
          <GetCertificateModal open={certificateModalOpen} onClose={closeCertificateModal} level={level} />
        </Box>
      </Container>
    </CustomErrorBoundary>
  );
};

export default memo(Certification);
