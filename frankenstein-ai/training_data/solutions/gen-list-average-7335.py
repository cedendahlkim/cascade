# Task: gen-list-average-7335 | Score: 100% | 2026-02-13T11:35:25.711195

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))