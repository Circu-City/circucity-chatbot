#!/bin/bash
export DATABASE_URL='postgresql://circucit_circucity_ai:CircuCityAI2025%21@127.0.0.1:5432/circucit_circuitcity_ai?schema=chatbot'
export JWT_SECRET='CHANGE_ME_JWT_SECRET'
export NEXT_PUBLIC_URL='https://chatbot.circucity.se'
export NEXT_PUBLIC_APP_NAME='CircuCity AI'
export NEXT_PUBLIC_APP_DESCRIPTION='Personalized AI Customer Support for E-commerce'
export NODE_ENV='production'
export PORT=3001
export STRIPE_PRICE_STARTER=price_1Th8bWR5wGiEooiWYR4Nj3zU
export STRIPE_PRICE_GROWTH=price_1Th8bXR5wGiEooiWwCZsZFO2
export STRIPE_PRICE_ENTERPRISE=price_1Th8bXR5wGiEooiWL9gq2H5L
export STRIPE_SECRET_KEY='REPLACE_WITH_YOUR_STRIPE_SECRET_KEY'
export STRIPE_WEBHOOK_SECRET='REPLACE_WITH_YOUR_STRIPE_WEBHOOK_SECRET'
export NEXT_PUBLIC_STRIPE_KEY='REPLACE_WITH_YOUR_STRIPE_PUBLISHABLE_KEY'
cd /opt/circuitcity-ai
exec npx next start
