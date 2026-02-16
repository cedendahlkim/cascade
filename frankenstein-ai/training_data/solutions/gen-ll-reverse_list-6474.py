# Task: gen-ll-reverse_list-6474 | Score: 100% | 2026-02-12T14:50:50.954434

n = int(input())
l = []
for i in range(n):
  l.append(input())

l.reverse()
print(*l)