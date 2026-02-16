# Task: gen-ds-reverse_with_stack-2944 | Score: 100% | 2026-02-13T18:33:55.938730

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))