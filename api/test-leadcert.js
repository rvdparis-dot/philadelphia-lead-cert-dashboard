
// api/test-leadcert.js
// Test endpoint to debug Philadelphia Lead Certification API

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Testing Philadelphia Lead Certification API...');

    // Test 1: Basic connection test - get service info
    const serviceInfoUrl = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/lhhp_lead_certifications/FeatureServer/0?f=json';
    
    console.log('Getting service info from:', serviceInfoUrl);
    
    const serviceInfoResponse = await fetch(serviceInfoUrl);
    const serviceInfo = await serviceInfoResponse.json();
    
    console.log('Service info response:', JSON.stringify(serviceInfo, null, 2));

    // Test 2: Get a small sample of records to see field structure
    const sampleUrl = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/lhhp_lead_certifications/FeatureServer/0/query';
    const sampleParams = new URLSearchParams({
      outFields: '*',
      where: '1=1',
      returnGeometry: 'false',
      f: 'json',
      resultRecordCount: '3' // Just get 3 records to see structure
    });

    const sampleApiUrl = `${sampleUrl}?${sampleParams.toString()}`;
    console.log('Getting sample data from:', sampleApiUrl);

    const sampleResponse = await fetch(sampleApiUrl);
    const sampleData = await sampleResponse.json();

    console.log('Sample data response:', JSON.stringify(sampleData, null, 2));

    // Test 3: Test specific address search (like your "808 W Norris" search)
    const addressTestUrl = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/lhhp_lead_certifications/FeatureServer/0/query';
    const addressParams = new URLSearchParams({
      outFields: '*',
      where: "UPPER(ADDRESS) LIKE UPPER('%NORRIS%')",
      returnGeometry: 'false',
      f: 'json',
      resultRecordCount: '5'
    });

    const addressTestApiUrl = `${addressTestUrl}?${addressParams.toString()}`;
    console.log('Testing address search:', addressTestApiUrl);

    const addressResponse = await fetch(addressTestApiUrl);
    const addressData = await addressResponse.json();

    console.log('Address search response:', JSON.stringify(addressData, null, 2));

    // Test 4: Test OPA account search
    const opaTestUrl = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/lhhp_lead_certifications/FeatureServer/0/query';
    const opaParams = new URLSearchParams({
      outFields: '*',
      where: "OPA_ACCOUNT_NUM IS NOT NULL",
      returnGeometry: 'false',
      f: 'json',
      resultRecordCount: '3'
    });

    const opaTestApiUrl = `${opaTestUrl}?${opaParams.toString()}`;
    console.log('Testing OPA search:', opaTestApiUrl);

    const opaResponse = await fetch(opaTestApiUrl);
    const opaData = await opaResponse.json();

    console.log('OPA search response:', JSON.stringify(opaData, null, 2));

    // Compile results
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        service_info: {
          success: !serviceInfo.error,
          data: serviceInfo,
          url: serviceInfoUrl,
          error: serviceInfo.error || null
        },
        sample_data: {
          success: !sampleData.error,
          recordCount: sampleData.features ? sampleData.features.length : 0,
          fields: sampleData.fields ? sampleData.fields.map(f => ({ name: f.name, type: f.type, alias: f.alias })) : [],
          sampleRecords: sampleData.features ? sampleData.features.slice(0, 2) : [],
          url: sampleApiUrl,
          error: sampleData.error || null
        },
        address_search: {
          success: !addressData.error,
          searchTerm: 'NORRIS',
          recordCount: addressData.features ? addressData.features.length : 0,
          sampleRecords: addressData.features ? addressData.features.slice(0, 2) : [],
          url: addressTestApiUrl,
          error: addressData.error || null
        },
        opa_search: {
          success: !opaData.error,
          recordCount: opaData.features ? opaData.features.length : 0,
          sampleRecords: opaData.features ? opaData.features.slice(0, 1) : [],
          url: opaTestApiUrl,
          error: opaData.error || null
        }
      },
      field_analysis: sampleData.fields ? {
        total_fields: sampleData.fields.length,
        field_names: sampleData.fields.map(f => f.name),
        likely_address_fields: sampleData.fields.filter(f => 
          f.name.toLowerCase().includes('address') || 
          f.name.toLowerCase().includes('addr')
        ).map(f => ({ name: f.name, alias: f.alias })),
        likely_opa_fields: sampleData.fields.filter(f => 
          f.name.toLowerCase().includes('opa') || 
          f.name.toLowerCase().includes('account')
        ).map(f => ({ name: f.name, alias: f.alias })),
        likely_cert_fields: sampleData.fields.filter(f => 
          f.name.toLowerCase().includes('cert') || 
          f.name.toLowerCase().includes('status') ||
          f.name.toLowerCase().includes('date')
        ).map(f => ({ name: f.name, alias: f.alias }))
      } : null,
      recommendations: generateRecommendations(serviceInfo, sampleData, addressData, opaData),
      quick_diagnosis: generateQuickDiagnosis(serviceInfo, sampleData, addressData)
    });

  } catch (error) {
    console.error('Test API Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      note: 'This is a network or API connection error'
    });
  }
}

function generateRecommendations(serviceInfo, sampleData, addressData, opaData) {
  const recommendations = [];

  if (serviceInfo.error) {
    recommendations.push({
      priority: 'CRITICAL',
      issue: 'Service Info Error',
      message: serviceInfo.error.message,
      solution: 'The ArcGIS service is not accessible. Check if the service URL is correct and the service is online.',
      code: serviceInfo.error.code
    });
  }

  if (sampleData.error) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Sample Data Error',
      message: sampleData.error.message,
      solution: 'Query syntax or parameters are incorrect. Check the WHERE clause and field names.',
      code: sampleData.error.code
    });
  }

  if (addressData.error) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Address Search Error',
      message: addressData.error.message,
      solution: 'Address search syntax is wrong. Check the field name for addresses in the database.',
      code: addressData.error.code
    });
  }

  if (!serviceInfo.error && !sampleData.error && sampleData.features && sampleData.features.length === 0) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: 'No Data Returned',
      message: 'API is working but no records found',
      solution: 'Database might be empty, have access restrictions, or require authentication.'
    });
  }

  if (!sampleData.error && sampleData.features && sampleData.features.length > 0) {
    recommendations.push({
      priority: 'SUCCESS',
      issue: 'API Working!',
      message: `Successfully retrieved ${sampleData.features.length} sample records`,
      solution: 'API is working correctly. Use the field names from field_analysis section for your queries.'
    });
  }

  if (!addressData.error && addressData.features && addressData.features.length > 0) {
    recommendations.push({
      priority: 'SUCCESS',
      issue: 'Address Search Working!',
      message: `Found ${addressData.features.length} records for "NORRIS"`,
      solution: 'Address search is working. Your original search should work with the fixed API code.'
    });
  }

  return recommendations;
}

function generateQuickDiagnosis(serviceInfo, sampleData, addressData) {
  if (serviceInfo.error) {
    return {
      status: 'FAILED',
      message: 'Cannot connect to Philadelphia API',
      action: 'Check if the service URL is correct: https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/lhhp_lead_certifications/FeatureServer/0'
    };
  }

  if (sampleData.error) {
    return {
      status: 'CONNECTION_OK_QUERY_FAILED',
      message: 'Can connect to API but queries are failing',
      action: 'Check the field names and query syntax in the main API file'
    };
  }

  if (!sampleData.features || sampleData.features.length === 0) {
    return {
      status: 'EMPTY_DATABASE',
      message: 'API works but no data found',
      action: 'Database might be empty or require authentication'
    };
  }

  if (addressData.error) {
    return {
      status: 'BASIC_OK_SEARCH_FAILED',
      message: 'Basic queries work but address search fails',
      action: 'Fix the ADDRESS field name in search queries'
    };
  }

  return {
    status: 'ALL_SYSTEMS_GO',
    message: 'API is working correctly!',
    action: 'Your main API should work now. Try your search again.'
  };
}
