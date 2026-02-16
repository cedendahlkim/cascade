# Task: gen-list-average-3740 | Score: 100% | 2026-02-15T11:13:42.636462

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))