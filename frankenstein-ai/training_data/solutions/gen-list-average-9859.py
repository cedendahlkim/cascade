# Task: gen-list-average-9859 | Score: 100% | 2026-02-15T12:30:06.854415

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))