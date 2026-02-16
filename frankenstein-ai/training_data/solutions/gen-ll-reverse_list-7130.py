# Task: gen-ll-reverse_list-7130 | Score: 100% | 2026-02-13T18:37:58.425172

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))