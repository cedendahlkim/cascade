# Task: gen-ll-reverse_list-4853 | Score: 100% | 2026-02-13T18:40:48.440827

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))