# Task: 4.5 | Score: 100% | 2026-02-13T18:31:47.100099

def gcd(a, b):
  while(b):
    a, b = b, a % b
  return a

a = int(input())
b = int(input())
print(gcd(a, b))