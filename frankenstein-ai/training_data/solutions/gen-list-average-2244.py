# Task: gen-list-average-2244 | Score: 100% | 2026-02-13T20:50:15.831708

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))