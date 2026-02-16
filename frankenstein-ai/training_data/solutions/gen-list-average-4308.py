# Task: gen-list-average-4308 | Score: 100% | 2026-02-15T09:02:09.734634

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))