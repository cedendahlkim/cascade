# Task: gen-ll-reverse_list-3275 | Score: 100% | 2026-02-12T19:51:36.920022

n = int(input())
l = []
for i in range(n):
  l.append(input())

l.reverse()
print(*l)