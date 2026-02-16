# Task: gen-list-average-7174 | Score: 100% | 2026-02-13T20:32:59.300639

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))