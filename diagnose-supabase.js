// Diagnostic script to inspect Supabase database
// Run with: node diagnose-supabase.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wkbntjfiwzoauzxnowfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYm50amZpd3pvYXV6eG5vd2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTc4NzIsImV4cCI6MjA3NzQ5Mzg3Mn0.CgilBvYCUkbScycnZ8OWy_eAjUF0i698lcDbWHcM5ic';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseDatabase() {
    console.log('🔍 Diagnosing Supabase Database...\n');
    
    // List of tables to check
    const tablesToCheck = [
        'profiles',
        'users', 
        'companies',
        'access_codes',
        'policies',
        'policy_views',
        'categories',
        'organizations',
        'drafts'
    ];
    
    const results = {};
    
    for (const tableName of tablesToCheck) {
        try {
            console.log(`Checking table: ${tableName}...`);
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);
            
            if (error) {
                if (error.code === '42P01') {
                    console.log(`  ❌ Table "${tableName}" does not exist\n`);
                    results[tableName] = { exists: false };
                } else {
                    console.log(`  ⚠️  Error: ${error.message}\n`);
                    results[tableName] = { exists: false, error: error.message };
                }
            } else {
                console.log(`  ✅ Table "${tableName}" exists`);
                
                // Try to get column info by fetching one row
                if (data && data.length > 0) {
                    const columns = Object.keys(data[0]);
                    console.log(`  📋 Columns: ${columns.join(', ')}`);
                    results[tableName] = { 
                        exists: true, 
                        columns: columns,
                        sampleRow: data[0]
                    };
                } else {
                    // Table exists but is empty - try to infer structure from a query
                    const { data: emptyData, error: emptyError } = await supabase
                        .from(tableName)
                        .select('*')
                        .limit(0);
                    
                    if (!emptyError) {
                        console.log(`  📋 Table exists but is empty`);
                        results[tableName] = { exists: true, empty: true };
                    }
                }
                console.log('');
            }
        } catch (err) {
            console.log(`  ❌ Exception: ${err.message}\n`);
            results[tableName] = { exists: false, error: err.message };
        }
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(50));
    const existingTables = Object.keys(results).filter(t => results[t].exists);
    const missingTables = Object.keys(results).filter(t => !results[t].exists);
    
    console.log(`\n✅ Existing tables (${existingTables.length}):`);
    existingTables.forEach(table => {
        const info = results[table];
        if (info.columns) {
            console.log(`  - ${table}: ${info.columns.length} columns`);
        } else {
            console.log(`  - ${table}: (empty)`);
        }
    });
    
    console.log(`\n❌ Missing tables (${missingTables.length}):`);
    missingTables.forEach(table => {
        console.log(`  - ${table}`);
    });
    
    // Check for data
    console.log(`\n📦 Data Counts:`);
    for (const table of existingTables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (!error && count !== null) {
                console.log(`  - ${table}: ${count} rows`);
            }
        } catch (err) {
            console.log(`  - ${table}: Unable to count`);
        }
    }
    
    return results;
}

// Run diagnosis
diagnoseDatabase()
    .then(results => {
        console.log('\n✅ Diagnosis complete!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Diagnosis failed:', error);
        process.exit(1);
    });

