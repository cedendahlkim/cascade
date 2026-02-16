# Task: gen-ll-reverse_list-6937 | Score: 100% | 2026-02-13T18:38:28.632485

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))