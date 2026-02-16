# Task: gen-list-average-9092 | Score: 100% | 2026-02-13T09:33:16.834999

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))