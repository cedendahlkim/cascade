# Task: gen-ll-reverse_list-3863 | Score: 100% | 2026-02-12T19:21:40.818340

n = int(input())
l = []
for _ in range(n):
  l.append(input())

l.reverse()
print(*l)