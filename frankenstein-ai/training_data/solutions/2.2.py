# Task: 2.2 | Score: 100% | 2026-02-13T18:29:49.674849

a = int(input())
b = int(input())
c = int(input())

if a >= b and a >= c:
  print(a)
elif b >= a and b >= c:
  print(b)
else:
  print(c)