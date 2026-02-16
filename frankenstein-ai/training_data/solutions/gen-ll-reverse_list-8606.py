# Task: gen-ll-reverse_list-8606 | Score: 100% | 2026-02-13T16:07:18.525795

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))