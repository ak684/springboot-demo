import React, { memo } from 'react';
import { Box, Button, Divider, Typography } from "@mui/material";
import Modal from "shared-components/views/components/modal/Modal";
import { useDispatch } from "react-redux";
import { certificationThunks } from "store/ducks/certification";

const level1Text = 'Congratulations! You have fulfilled all steps to potentially qualify as a certified impact venture. A certification allows you to show to investors, employees and customers that you fulfill the highest standards to create a positive impact and it is a way to receive validation and review for what you have developed. It is a form of reward, that helps you stand out from the rest.\n' +
  '\nClick on "Send for review" button. A member of our review team will receive access to your ventures impact data that you entered. Within 3 days, you will receive an e-mail from our review team, with either an acceptance, requests for edits or a rejection with reasons for a rejection. This is a no risk process, as we will only charge you, once you qualify for the certification. Please note that level 1 is valid for 1 year only, after which you will need to qualify for level 2, or lose your certification.'

const otherLevelsText = (level) => `Congratulations! You have fulfilled all steps to qualify for a certified impact venture, Level ${level}. Continue to stand out from the rest, and show to investors, employees and customers that you fulfill the highest standards to create a positive impact.
\nClick on "Send for review" button. A member of our review team will receive access to your ventures impact data that you entered. Within 3 days, you will receive an e-mail from our review team, with either an acceptance of Level ${level}, requests for edits or a rejection with reasons for a rejection. This is a no risk process, as we will only charge you, once you qualify for the next level certification.
\nThank you for creating a venture, that contribute to positive change for our world!`;

const certificationPrices = {
  1: 999,
  2: 1499,
  3: 1999,
  4: 2999,
  5: 4999
}

const GetCertificateModal = ({ open, onClose, level }) => {
  const dispatch = useDispatch();

  const getCertificate = () => {
    dispatch(certificationThunks.getCertificateForLevel(level));
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title='Get certificate'
    >
      <Box display='flex' gap={4}>
        <Box component='img' width={116} height={116} src={`/images/certification/level${level}.png`} />
        <Box display='flex' flexGrow={1} flexDirection='column' gap={3}>
          <Typography variant='bodyBold'>Get certificate for Level {level}</Typography>
          <Typography variant='subtitle' sx={{ whiteSpace: 'break-spaces' }}>
            {level === 1 && level1Text}
            {level > 1 && otherLevelsText(level)}
          </Typography>
          <Divider flexItem />
          <Box display='flex' alignItems='center' gap={3}>
            <Typography variant='bodyBold'>${certificationPrices[level]}</Typography>
            <Button onClick={getCertificate}>Send for review</Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default memo(GetCertificateModal);
