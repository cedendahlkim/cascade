# Task: gen-list-average-6820 | Score: 100% | 2026-02-13T14:31:07.626166

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))