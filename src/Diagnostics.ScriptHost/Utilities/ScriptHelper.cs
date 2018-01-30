﻿using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace Diagnostics.ScriptHost.Utilities
{
    public class ScriptHelper
    {
        public static ImmutableArray<string> GetFrameworkReferences() => ImmutableArray.Create(
                "System.Data",
                "Diagnostics.DataProviders.dll"
            );

        public static ImmutableArray<string> GetFrameworkImports() => ImmutableArray.Create(
                "System.Data"
            );
    }
}