# Task: gen-list-average-8438 | Score: 100% | 2026-02-13T18:01:17.115738

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))