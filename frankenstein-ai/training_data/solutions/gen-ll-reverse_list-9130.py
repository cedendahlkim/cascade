# Task: gen-ll-reverse_list-9130 | Score: 100% | 2026-02-12T19:12:10.354921

n = int(input())
l = []
for i in range(n):
  l.append(input())

l.reverse()

print(*l)