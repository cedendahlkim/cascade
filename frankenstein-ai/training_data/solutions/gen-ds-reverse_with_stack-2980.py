# Task: gen-ds-reverse_with_stack-2980 | Score: 100% | 2026-02-12T19:51:37.420195

n = int(input())
l = []
for i in range(n):
  l.append(input())

l.reverse()
print(*l)