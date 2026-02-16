# Task: gen-dp-climb_stairs-6544 | Score: 100% | 2026-02-11T10:31:22.268590

def solve():
  n = int(input())
  
  if n <= 2:
    print(n)
    return
  
  a = 1
  b = 2
  
  for _ in range(3, n + 1):
    temp = a + b
    a = b
    b = temp
    
  print(b)

solve()