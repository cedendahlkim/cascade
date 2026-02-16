# Task: gen-ll-reverse_list-7253 | Score: 100% | 2026-02-12T12:17:19.596150

n = int(input())
l = []
for i in range(n):
  l.append(input())

l.reverse()
print(*l)