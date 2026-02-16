# Task: gen-ll-reverse_list-8535 | Score: 100% | 2026-02-10T15:43:40.427681

n = int(input())
arr = []
for _ in range(n):
    arr.append(int(input()))

arr.reverse()
print(*arr)