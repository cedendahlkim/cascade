# Task: gen-ds-reverse_with_stack-9677 | Score: 100% | 2026-02-13T18:28:48.073053

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))