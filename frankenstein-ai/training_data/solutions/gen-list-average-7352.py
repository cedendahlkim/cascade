# Task: gen-list-average-7352 | Score: 100% | 2026-02-13T19:35:43.643925

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))