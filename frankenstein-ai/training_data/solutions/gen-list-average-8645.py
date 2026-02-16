# Task: gen-list-average-8645 | Score: 100% | 2026-02-13T13:42:56.437426

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))