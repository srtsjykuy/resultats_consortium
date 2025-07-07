// Utilitaires d'export améliorés
export const generateCSV = (data: any[], filename: string): void => {
  const headers = ['Nom', 'Prenom', 'Email', 'Numero', 'Points'];
  const csvContent = [
    headers.join(','),
    ...data.map(item => 
      `"${item.nom}","${item.prenom}","${item.email}","${item.numero}",${item.points}`
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const generateBackup = (data: any): void => {
  const backup = {
    data,
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
  
  const blob = new Blob([JSON.stringify(backup, null, 2)], { 
    type: 'application/json' 
  });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `consortium_backup_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};