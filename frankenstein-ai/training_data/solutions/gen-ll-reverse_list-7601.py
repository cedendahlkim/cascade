# Task: gen-ll-reverse_list-7601 | Score: 100% | 2026-02-12T20:39:35.524253

n = int(input())
l = []
for i in range(n):
  l.append(input())

l.reverse()
print(*l)