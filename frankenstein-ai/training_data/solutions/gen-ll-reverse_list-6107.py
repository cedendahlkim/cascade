# Task: gen-ll-reverse_list-6107 | Score: 100% | 2026-02-13T18:43:46.310476

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))