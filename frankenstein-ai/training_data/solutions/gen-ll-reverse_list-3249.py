# Task: gen-ll-reverse_list-3249 | Score: 100% | 2026-02-10T15:43:58.971625

n = int(input())
arr = []
for _ in range(n):
    arr.append(int(input()))

arr.reverse()
print(*arr)