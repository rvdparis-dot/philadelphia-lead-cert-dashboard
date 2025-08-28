export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { search = '', limit = 25 } = req.method === 'GET' ? req.query : req.body;

    console.log('Philadelphia Lead API called with:', { search, limit });

    const baseURL = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/lhhp_lead_certifications/FeatureServer/0/query';
    
    let whereClause = '1=1';
    
    if (search && search.trim()) {
      const searchTerm = search.trim().replace(/'/g, "''");
      const searchConditions = [
        `UPPER(ADDRESS) LIKE UPPER('%${searchTerm}%')`,
        `UPPER(PROPERTY_ADDRESS) LIKE UPPER('%${searchTerm}%')`,
        `OPA_ACCOUNT_NUM LIKE '%${searchTerm}%'`,
        `UPPER(INSPECTOR_NAME) LIKE UPPER('%${searchTerm}%')`,
        `UPPER(PROPERTY_OWNER) LIKE UPPER('%${searchTerm}%')`,
        `UPPER(OWNER_NAME) LIKE UPPER('%${searchTerm}%')`
      ];
      whereClause += ` AND (${searchConditions.join(' OR ')})`;
    }

    const params = new URLSearchParams({
      outFields: '*',
      where: whereClause,
      returnGeometry: 'false',
      outSR: '4326',
      f: 'json',
      resultRecordCount: Math.min(parseInt(limit), 100),
      orderByFields: 'CERT_DATE DESC, CERTIFICATION_DATE DESC'
    });

    const apiURL = `${baseURL}?${params.toString()}`;
    console.log('Calling Philadelphia API...');

    const response = await fetch(apiURL);
    
    if (!response.ok) {
      throw new Error(`Philadelphia API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Philadelphia API Error: ${data.error.message || 'Unknown error'}`);
    }

    const features = data.features || [];
    console.log(`Retrieved ${features.length} records from Philadelphia API`);

    const processedData = features.map((feature, index) => {
      const attrs = feature.attributes;
      
      return {
        objectid: attrs.OBJECTID || attrs.objectid || index + 1,
        address: attrs.ADDRESS || attrs.PROPERTY_ADDRESS || 'Address Not Available',
        opa_account_num: attrs.OPA_ACCOUNT_NUM || attrs.opa_account_num,
        cert_date: attrs.CERT_DATE || attrs.CERTIFICATION_DATE,
        cert_expiry: attrs.CERT_EXPIRY || attrs.EXPIRY_DATE,
        cert_status: attrs.CERT_STATUS || attrs.STATUS || 'Unknown',
        cert_type: attrs.CERT_TYPE || attrs.CERTIFICATION_TYPE,
        inspector: attrs.INSPECTOR_NAME || attrs.INSPECTOR_COMPANY || 'Not Available',
        property_owner: attrs.PROPERTY_OWNER || attrs.OWNER_NAME,
        compliance_status: attrs.COMPLIANCE_STATUS
      };
    });

    const validData = processedData.filter(record => 
      record.address && record.address !== 'Address Not Available'
    );

    console.log(`Processed ${validData.length} valid records`);

    return res.status(200).json({
      success: true,
      data: validData,
      totalRows: validData.length,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'Philadelphia Department of Public Health',
        total_features: features.length,
        valid_records: validData.length
      }
    });

  } catch (error) {
    console.error('Philadelphia Lead API Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}