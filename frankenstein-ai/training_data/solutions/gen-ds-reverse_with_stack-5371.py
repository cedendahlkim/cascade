# Task: gen-ds-reverse_with_stack-5371 | Score: 100% | 2026-02-13T15:10:57.543910

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))