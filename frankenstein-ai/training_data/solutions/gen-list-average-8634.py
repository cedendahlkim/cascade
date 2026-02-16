# Task: gen-list-average-8634 | Score: 100% | 2026-02-13T09:33:21.003072

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))