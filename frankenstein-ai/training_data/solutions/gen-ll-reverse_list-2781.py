# Task: gen-ll-reverse_list-2781 | Score: 100% | 2026-02-12T12:50:38.758476

n = int(input())
l = []
for i in range(n):
  l.append(input())

l.reverse()
print(*l)