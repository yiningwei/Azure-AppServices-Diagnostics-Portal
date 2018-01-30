﻿using System;
using System.Collections.Generic;
using System.Data;
using System.Text;
using System.Threading.Tasks;

namespace Diagnostics.DataProviders
{
    public interface IKustoClient
    {
        Task<DataTable> ExecuteQueryAsync(string query, string stampName, string requestId = null);
    }
}