# Task: gen-ds-reverse_with_stack-2696 | Score: 100% | 2026-02-13T18:20:26.011719

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))