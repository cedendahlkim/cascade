# Task: gen-rec-sum_digits-9043 | Score: 100% | 2026-02-12T19:56:41.191849

def rekursiv_siffersumma(n):
  """Beräknar den rekursiva siffersumman av ett positivt heltal."""
  s = sum(int(siffra) for siffra in str(n))
  if s < 10:
    return s
  else:
    return rekursiv_siffersumma(s)

n = int(input())
print(rekursiv_siffersumma(n))