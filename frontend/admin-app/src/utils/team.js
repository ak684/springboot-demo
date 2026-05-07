export const NO_ACCESS = 'NO_ACCESS';
export const ACCESS_OWNER = 'OWNER';

export const getUserAccess = (company, user) => {
  if (company.organization.users.find(u => u.id === user?.id)) {
    return { access: ACCESS_OWNER };
  }

  return company.members.find(a => a.member.id === user?.id) || { access: NO_ACCESS };
}

export const getTeamAccessMap = (companies, user) => companies.reduce((acc, company) => {
  acc[company.id] = getUserAccess(company, user);
  return acc;
}, {});
