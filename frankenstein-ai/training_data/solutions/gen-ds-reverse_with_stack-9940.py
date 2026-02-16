# Task: gen-ds-reverse_with_stack-9940 | Score: 100% | 2026-02-14T12:59:50.628248

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))