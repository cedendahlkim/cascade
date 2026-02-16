# Task: gen-ll-reverse_list-7611 | Score: 100% | 2026-02-13T10:14:46.724462

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))