# Task: gen-ds-reverse_with_stack-3021 | Score: 100% | 2026-02-13T17:36:32.837914

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))