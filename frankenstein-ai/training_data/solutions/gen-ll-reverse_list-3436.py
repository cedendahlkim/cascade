# Task: gen-ll-reverse_list-3436 | Score: 100% | 2026-02-13T18:36:03.902097

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))