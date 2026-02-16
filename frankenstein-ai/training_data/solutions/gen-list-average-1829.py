# Task: gen-list-average-1829 | Score: 100% | 2026-02-13T18:33:59.446717

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))