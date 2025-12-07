#!/bin/bash

# Script para consultar pins por color en Vercel KV

# Colores disponibles
echo "🎨 Query Pins by Color"
echo "====================="
echo ""

# Función para consultar por color
query_color() {
    local color=$1
    echo "🔍 Searching for pins with color: $color"
    echo ""
    
    # Hacer la consulta
    response=$(curl -s "https://viiibe-backend-hce5.vercel.app/api/get-saved-pins?color=$color")
    
    # Extraer el total
    total=$(echo $response | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
    
    echo "✅ Found $total pins with color '$color'"
    echo ""
    
    # Mostrar los primeros 5 pins
    echo "📌 First 5 pins:"
    echo $response | jq -r '.pins[:5] | .[] | "  - \(.title) (ID: \(.id))"' 2>/dev/null || echo "  (Install jq for better formatting)"
    echo ""
}

# Si se pasa un argumento, buscar ese color
if [ $# -eq 1 ]; then
    query_color "$1"
else
    # Si no, mostrar menú
    echo "Usage: ./query-pins-color.sh <color>"
    echo ""
    echo "Examples:"
    echo "  ./query-pins-color.sh red"
    echo "  ./query-pins-color.sh blue"
    echo "  ./query-pins-color.sh green"
    echo ""
    echo "Or query all pins:"
    echo "  curl https://viiibe-backend-hce5.vercel.app/api/get-saved-pins"
fi
