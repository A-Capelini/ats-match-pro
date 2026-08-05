import os
import json
import traceback
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Configuração rigorosa da API Key do Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("Chave de API do Gemini não configurada no servidor (GEMINI_API_KEY). Verifique o seu arquivo .env.")

# Inicializa o cliente com a nova arquitetura oficial do Google GenAI
client = genai.Client(api_key=GEMINI_API_KEY)
router = APIRouter()

class AnalyzeRequest(BaseModel):
    job_title: str
    job_description: str
    resume_text: str

@router.post("/api/analyze")
async def analyze_resume(request: Request, payload: AnalyzeRequest):
    try:
        prompt = f"""
        Você é um Engenheiro de Software Sênior e Especialista em Aquisição de Talentos (ATS).
        Analise o currículo abaixo em relação à vaga descrita.
        
        Vaga: {payload.job_title}
        Descrição da Vaga: {payload.job_description}
        Currículo Original: {payload.resume_text}
        
        Sua resposta DEVE ser EXATAMENTE um objeto JSON válido (sem marcação markdown, sem textos extras) contendo estas chaves:
        - "score": (inteiro de 0 a 100) Compatibilidade do currículo atual com a vaga.
        - "strengths": (lista de strings) Pontos fortes encontrados.
        - "missing_keywords": (lista de strings) Palavras-chave exigidas na vaga que faltam no currículo.
        - "ats_optimized_resume": (string) O currículo reescrito e formatado em texto puro para passar no ATS.
        - "optimized_score": (inteiro) Estimativa do score do currículo após a sua reescrita.
        - "suggestions": (lista de strings) Recomendações estruturais de melhoria.
        """

        # NOTA: 'gemini-1.5-flash' e 'gemini-pro' foram desativados pelo Google.
        # 'gemini-2.5-flash' não está mais disponível para chaves de API novas
        # (erro 404 NOT_FOUND: "no longer available to new users").
        # 'gemini-3.6-flash' é o modelo GA atual (lançado 21/07/2026).
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
        )
        
        response_text = response.text.strip()
        
        # Tratamento de segurança para JSON
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        elif response_text.startswith("```"):
            response_text = response_text[3:]
            
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        return json.loads(response_text.strip())
        
    except json.JSONDecodeError as e:
        print("\n" + "="*50)
        print("🚨 ERRO DE PARSER: O GEMINI NÃO RETORNOU JSON 🚨")
        print(f"O que ele tentou devolver:\n{response_text}")
        print("="*50 + "\n")
        raise HTTPException(
            status_code=500, 
            detail="Erro ao processar a análise: A inteligência artificial não retornou um JSON estruturado."
        )
        
    except Exception as e:
        print("\n" + "="*50)
        print("🚨 ERRO CRÍTICO NA COMUNICAÇÃO COM O GEMINI 🚨")
        traceback.print_exc()
        print("="*50 + "\n")
        raise HTTPException(
            status_code=500, 
            detail=f"Falha na comunicação com o provedor de IA: {str(e)}"
        )